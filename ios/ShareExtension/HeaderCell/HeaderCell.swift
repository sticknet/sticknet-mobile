//
//  HeaderCell.swift
//  ShareExtension
//
//  Created by Omar Basem on 05/03/2020.
//  Copyright © 2020 STiiiCK. All rights reserved.
//

import UIKit

class HeaderCell: UITableViewCell {

  @IBOutlet weak var title: UILabel!
  override func awakeFromNib() {
        super.awakeFromNib()
        // Initialization code
    }

    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)

        // Configure the view for the selected state
    }
    
}
