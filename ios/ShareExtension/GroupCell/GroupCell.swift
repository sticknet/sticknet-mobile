//
//  GroupCell.swift
//  ShareExtension
//
//  Created by Omar Basem on 9/1/19.
//  Copyright © 2019 STiiiCK. All rights reserved.
//

import UIKit

class GroupCell: UITableViewCell {

    @IBOutlet weak var displayName: UILabel!
    @IBOutlet weak var cover: UIImageView!
    @IBOutlet weak var check: UIImageView!
    override func awakeFromNib() {
        super.awakeFromNib()
        // Initialization code
//      check.rightAnchor.constraint(equalTo: check.trailingAnchor, constant: -10).isActive = true
    }
  

//    override func setSelected(_ selected: Bool, animated: Bool) {
//        super.setSelected(selected, animated: animated)
//
//        // Configure the view for the selected state
//    }
    
}
